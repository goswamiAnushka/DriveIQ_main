from fpdf import FPDF
import pandas as pd

# Generate PDF report for a driver
def generate_pdf_report(data, output_stream):
    try:
        pdf = FPDF()
        pdf.add_page()

        # Title
        pdf.set_font('Arial', 'B', 16)
        pdf.cell(200, 10, f"Driver Report: {data['name']}", ln=True, align='C')

        # Summary section
        pdf.set_font('Arial', '', 12)
        pdf.ln(10)
        pdf.cell(200, 10, f"Total Trips: {data.get('total_trips', 'N/A')}", ln=True)
        pdf.cell(200, 10, f"Average Score: {data.get('average_score', 'N/A')}", ln=True)

        # Trip details section
        pdf.ln(10)
        pdf.set_font('Arial', 'B', 12)
        pdf.cell(200, 10, 'Trip Details', ln=True)

        pdf.set_font('Arial', '', 12)
        if 'trips' in data and data['trips']:
            for trip in data['trips']:
                trip_id = trip.get('trip_id', 'N/A')
                score = trip.get('score', 'N/A')
                distance = trip.get('distance', 'N/A')
                category = trip.get('category', 'N/A')
                
                # Include more trip information like distance and category if available
                pdf.cell(200, 10, f"Trip ID: {trip_id} | Score: {score} | Distance: {distance} | Category: {category}", ln=True)
        else:
            pdf.cell(200, 10, 'No trip data available.', ln=True)

        # Save PDF to output stream
        pdf.output(output_stream)

    except Exception as e:
        print(f"Error generating PDF report: {str(e)}")
        raise


# Generate Excel report for a driver
def generate_excel_report(data, output_stream):
    try:
        if 'trips' in data and data['trips']:
            # Create DataFrame from trip data
            df = pd.DataFrame(data['trips'])
        else:
            # Create empty DataFrame if no trip data is available
            df = pd.DataFrame(columns=['trip_id', 'score', 'distance', 'category'])

        # Add additional columns if needed
        df.to_excel(output_stream, index=False)

    except Exception as e:
        print(f"Error generating Excel report: {str(e)}")
        raise
